export default function request(url, options) {
  if (!options) options = {};
  let req;
  let cancelable = new Promise(download);
  cancelable.cancel = cancel;

  return cancelable;

  function cancel() {
    if (req) {
      req.abort();
    }
  }

  function download(resolve, reject) {
    req = new XMLHttpRequest();

    if (typeof options.progress === 'function') {
      req.addEventListener('progress', updateProgress, false);
      // req.upload.addEventListener('progress', updateProgress, false);
    }

    req.addEventListener('load', transferComplete, false);
    req.addEventListener('error', transferFailed, false);
    req.addEventListener('abort', transferCanceled, false);

    req.open(options.method || 'GET', url);
    if (options.responseType) {
      req.responseType = options.responseType;
    }
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        req.setRequestHeader(key, options.headers[key]);
      });
    }

    if (options.method === 'POST') {
      req.send(options.body);
    } else {
      req.send(null);
    }

    function updateProgress(e) {
      if (e.lengthComputable) {
        options.progress({
          loaded: e.loaded,
          total: e.total,
          percent: e.loaded / e.total,
          lengthComputable: true
        });
      } else {
        options.progress({
          loaded: e.loaded,
          lengthComputable: false
        });
      }
    }

    function transferComplete() {
      if (req.status !== 200) {
        reject(`Unexpected status code ${req.status} when calling ${url}`);
        return;
      }
      var response = req.response;

      if (options.responseType === 'json' && typeof response === 'string') {
        // IE
        response = JSON.parse(response);
      }

      resolve(response);
    }

    function transferFailed() {
      reject(`Failed to download ${url}`);
    }

    function transferCanceled() {
      reject({
        cancelled: true,
        message: `Cancelled download of ${url}`
      });
    }
  }
}