import process from 'node:process';
import { spawn } from 'node:child_process';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
}

async function getVercelPreviewUrlFromGitHub() {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_SHA } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_SHA) {
    throw new Error('Missing GITHUB_TOKEN/GITHUB_REPOSITORY/GITHUB_SHA for preview URL lookup.');
  }

  const [owner, repo] = GITHUB_REPOSITORY.split('/');

  const deployments = await fetchJSON(
    `https://api.github.com/repos/${owner}/${repo}/deployments?sha=${GITHUB_SHA}`
  );

  for (const dep of deployments) {
    const statuses = await fetchJSON(
      `https://api.github.com/repos/${owner}/${repo}/deployments/${dep.id}/statuses`
    );

    const success = statuses.find((s) => s.state === 'success' && s.target_url);
    if (success?.target_url) return success.target_url.replace(/\/$/, '');
  }

  throw new Error('No successful Vercel deployment status found yet for this SHA.');
}

function urlsFor(base) {
  const b = base.replace(/\/$/, '');
  return [`${b}/`, `${b}/blog/`, `${b}/privacy/`, `${b}/blog/resetting-a-team-culture`];
}

async function main() {
  let baseUrl = process.env.LH_BASE_URL;

  if (!baseUrl && process.env.GITHUB_ACTIONS === 'true') {
    baseUrl = await getVercelPreviewUrlFromGitHub();
  }

  if (!baseUrl) {
    throw new Error(
      'No base URL for Lighthouse. Set LH_BASE_URL (local) or run in GitHub Actions PR (preview URL).'
    );
  }

  const urls = urlsFor(baseUrl);

  const args = [
    'lhci',
    'autorun',
    '--config=./lighthouserc.json',
    ...urls.flatMap((u) => [`--collect.url=${u}`]),
  ];

  await run('npx', args);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
