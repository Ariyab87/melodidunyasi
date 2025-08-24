const store = require('../lib/requestStore');
const { getMusicProvider } = require('./providers');
const { mapProviderError } = require('./errorMap');

async function startGeneration(record) {
  const provider = getMusicProvider({ apiKey: record.providerApiKey });
  const now = () => new Date().toISOString();

  console.info(`[gen] scheduled for ${record.id}`);

  try {
    console.info(`[gen] starting for ${record.id}`);
    // Get callback URL from env or construct from backend URL
    const cbUrl = process.env.SUNOAPI_ORG_CALLBACK_URL
      || (process.env.BACKEND_PUBLIC_URL
          ? `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, '')}/api/song/callback`
          : undefined);

    const payload = {
      prompt: record.prompt,
      style: record.songStyle,
      tags: [record.mood, record.specialOccasion].filter(Boolean),
      instrumental: record.instrumental === true, // ensure boolean
      model: 'V4', // Default to V4 model
      customMode: false, // Default to standard mode
      callbackUrl: cbUrl
    };

    const res = await provider.generate(payload);

    const raw = res?.raw || res || {};
    const jobId = res?.jobId || raw?.jobId || raw?.taskId || raw?.task_id || raw?.id || raw?.data?.taskId || raw?.data?.id;
    
    if (!jobId) {
      const e = new Error('Provider did not return jobId'); 
      e.kind = 'NO_JOB_ID'; 
      throw e;
    }

    await store.update(record.id, { 
      provider: 'sunoapi_org',
      providerJobId: jobId,
      status: 'queued',
      updatedAt: now() 
    });
    await store.saveNow();
    console.info(`[map] ${record.id} -> jobId=${jobId}`);
  } catch (e) {
    // Auto-retry for instrumental error if record.instrumental is not a boolean
    if (e.status === 400 && /instrumental cannot be null/i.test(e.raw?.msg || '') && typeof record.instrumental !== 'boolean') {
      console.warn('[gen] retrying with instrumental=false');
      await store.update(record.id, { instrumental: false, updatedAt: now() });
      await store.saveNow();
      
      // One guarded retry
      try {
        const res2 = await provider.generate({
          prompt: record.prompt,
          style: record.songStyle,
          tags: [record.mood, record.specialOccasion].filter(Boolean),
          instrumental: false,
          model: 'V4',
          customMode: false,
          callbackUrl: cbUrl
        });

        const raw2 = res2?.raw || res2 || {};
        const jobId2 = res2?.jobId || raw2?.jobId || raw2?.taskId || raw2?.task_id || raw2?.id || raw2?.data?.taskId || raw2?.data?.id;
        
        if (!jobId2) {
          const e2 = new Error('Provider did not return jobId on retry'); 
          e2.kind = 'NO_JOB_ID'; 
          throw e2;
        }

        await store.update(record.id, { 
          provider: 'sunoapi_org', 
          providerJobId: jobId2, 
          status: 'queued', 
          updatedAt: now() 
        });
        await store.saveNow();
        console.info(`[map] ${record.id} -> jobId=${jobId2} (retry success)`);
        return; // Success, exit early
      } catch (retryError) {
        console.error('[gen] retry failed:', retryError.message);
        // Fall through to normal error handling
      }
    }

    const mapped = mapProviderError(e);
    console.error('[gen] failed:', mapped.type, '-', mapped.message);

    await store.update(record.id, {
      status: 'failed',
      providerError: {
        type: mapped.type,
        message: mapped.message,
        status: e.status ?? e.response?.status ?? null,
        code: e.response?.data?.code ?? null,
        raw: e.raw ?? e.response?.data ?? null,
        retryable: mapped.retryable,
      },
      updatedAt: now(),
    });
    await store.saveNow();
  }
}

async function checkSongStatus({ jobId, recordId }) {
  const provider = getMusicProvider();
  // provider.getRecordInfo must accept { jobId, recordId } as we implemented earlier
  const info = await provider.getRecordInfo({ jobId, recordId });
  return info; // { status, audioUrl, progress?, recordId?, tried? }
}

module.exports = {
  startGeneration,
  checkSongStatus,
};
