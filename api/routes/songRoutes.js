router.get('/song/status/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const jobIdFromQuery = (req.query.jobId || '').toString().trim() || null;
    if (!songId) {
      return res.status(400).json({ error: 'Missing song ID', message: 'Please provide a valid song ID' });
    }

    // Prevent cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');

    // micro-cache
    const cached = statusCache.get(songId);
    if (cached && (Date.now() - cached.ts) < TTL_MS) {
      return res.status(200).json(cached.payload);
    }

    // Try to load by songId first
    let record = await requestStore.getById(songId);

    // Fallback: if not found BUT client provided jobId, query provider and upsert
    if (!record && jobIdFromQuery) {
      try {
        const info = await sunoService.checkSongStatus({ jobId: jobIdFromQuery, recordId: null });

        // Upsert minimal record so future polls don't need jobId
        const now = new Date().toISOString();
        await requestStore.create({
          id: songId,
          provider: 'sunoapi_org',
          providerJobId: jobIdFromQuery,
          providerRecordId: info.recordId || null,
          status: info.status || 'processing',
          audioUrl: info.audioUrl || null,
          createdAt: now,
          updatedAt: now,
        }).catch(() => {}); // ignore if it already exists
        await requestStore.saveNow();

        // Build payload and micro-cache
        const payload = {
          status: info.status || 'processing',
          audioUrl: info.audioUrl || null,
          progress: typeof info.progress === 'number' ? info.progress : (info.status === 'completed' ? 100 : info.status === 'queued' ? 0 : 50),
          etaSeconds: info.estimatedTime ?? null,
          startedAt: info.startedAt || now,
          updatedAt: new Date().toISOString()
        };
        statusCache.set(songId, { ts: Date.now(), payload });
        return res.status(200).json(payload);
      } catch (e) {
        // Couldn’t query provider; tell client to retry
        return res.status(202).json({
          status: 'initializing',
          audioUrl: null,
          progress: 0,
          message: 'Record not found; provider query failed. Retry shortly.',
          detail: e.message
        });
      }
    }

    // If still nothing, behave like before
    if (!record) {
      return res.status(202).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request not yet persisted; retry soon.'
      });
    }

    // Existing logic (unchanged) from here ↓
    if (record.status === 'failed' || record.providerError) {
      return res.status(200).json({
        status: 'failed',
        audioUrl: null,
        progress: 100,
        errorType: record.providerError?.type || 'GEN_ERROR',
        errorMessage: record.providerError?.message || 'Generation failed',
        retryable: !!record.providerError?.retryable,
        billingUrl: process.env.PROVIDER_BILLING_URL_SUNOAPI || null
      });
    }

    if (!record.providerJobId) {
      const createdAt = new Date(record.createdAt);
      const ageSeconds = (Date.now() - createdAt) / 1000;
      if (record.status === 'pending' && ageSeconds > 8) {
        await requestStore.update(songId, {
          status: 'failed',
          providerError: {
            type: 'GEN_TIMEOUT',
            message: 'Generation did not start within expected time',
            code: 'TIMEOUT',
            data: { ageSeconds: ageSeconds.toFixed(1) }
          },
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        return res.status(200).json({
          status: 'failed',
          audioUrl: null,
          progress: 100,
          message: 'Generation did not start within expected time. Please try again.'
        });
      }
      return res.status(200).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request is initializing, waiting for provider assignment.'
      });
    }

    // Query provider with stored job/record id
    const info = await sunoService.checkSongStatus({
      jobId: record.providerJobId,
      recordId: record.providerRecordId,
    });

    if (info.recordId && !record.providerRecordId) {
      await requestStore.update(songId, { providerRecordId: info.recordId, updatedAt: new Date().toISOString() });
      await requestStore.saveNow();
    }

    let finalStatus = info;
    if (info.status === 'completed' && !info.audioUrl) {
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await sunoService.checkSongStatus({ jobId: record.providerJobId, recordId: record.providerRecordId });
        if (retry.audioUrl) { finalStatus = retry; break; }
      }
    }

    const normalized = {
      status: finalStatus.status || 'processing',
      audioUrl: finalStatus.audioUrl || null,
      progress: typeof finalStatus.progress === 'number'
        ? finalStatus.progress
        : (finalStatus.status === 'completed' ? 100 : finalStatus.status === 'queued' ? 0 : 50),
      etaSeconds: finalStatus.estimatedTime ?? null,
      startedAt: finalStatus.startedAt ?? record.createdAt,
      updatedAt: new Date().toISOString()
    };

    const patch = { status: normalized.status, updatedAt: normalized.updatedAt };
    if (finalStatus.audioUrl) patch.audioUrl = finalStatus.audioUrl;
    await requestStore.update(songId, patch);
    await requestStore.saveNow();

    const payload = {
      status: normalized.status,
      audioUrl: normalized.audioUrl,
      progress: normalized.progress,
      etaSeconds: normalized.etaSeconds,
      startedAt: normalized.startedAt,
      updatedAt: normalized.updatedAt
    };

    statusCache.set(songId, { ts: Date.now(), payload });

    res.set('Cache-Control', 'no-store');
    return res.json(payload);
  } catch (providerError) {
    if (providerError.code === 'AUTH_ERROR') {
      return res.status(200).json({ status: 'error', error: 'AUTH_ERROR', message: 'Authentication failed. Check API key and credits.', progress: 0 });
    }
    return res.status(200).json({ status: 'processing', error: providerError.message, message: `Provider temporarily unavailable: ${providerError.message}`, progress: 0 });
  }
});
