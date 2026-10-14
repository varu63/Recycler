// Initiates a single-node replica set so MongoDB multi-document transactions work.
try {
  const status = rs.status();
  if (status.ok) {
    quit(0);
  }
} catch (err) {
  // not yet initialized
}

try {
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017', priority: 1 }],
  });
  print('replica set initiated');
} catch (err) {
  print('rs.initiate failed: ' + err);
}
