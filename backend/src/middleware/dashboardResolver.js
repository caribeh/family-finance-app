const { pool } = require('../config/database');

async function getDashboardWorkspaceId(userId) {
  const result = await pool.query(
    'SELECT id FROM workspaces WHERE owner_id = $1',
    [userId]
  );
  const workspace = result.rows[0];
  if (!workspace) return null;
  return workspace.id;
}

function resolveDashboard(req, res, next) {
  getDashboardWorkspaceId(req.userId).then((workspaceId) => {
    req.workspaceId = workspaceId;
    next();
  }).catch((err) => {
    console.error('Error resolving dashboard:', err);
    req.workspaceId = null;
    next();
  });
}

module.exports = { getDashboardWorkspaceId, resolveDashboard };
