module.exports = (thefunc) => (reqs, resp, next) => {
  Promise.resolve(thefunc(reqs, resp, next)).catch(next);
};
