/**
 * @typedef {Object} MusicProvider
 * @property {() => {name:string, baseUrl:string}} getProviderInfo
 * @property {(opts: {prompt:string, style?:string, tags?:string[]}) => Promise<{jobId:string, recordId?:string, raw:any}>} generate
 * @property {(ids: {jobId:string, recordId?:string}) => Promise<any>} getRecordInfo
 */
