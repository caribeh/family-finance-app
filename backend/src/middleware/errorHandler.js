function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  if (err.message === 'All installments already paid') {
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Insufficient voucher balance') {
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Insufficient credit limit') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
