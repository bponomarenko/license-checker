const axios = require('axios');

const client = axios.create({ baseURL: 'http://registry.npmjs.org' });

async function getPackages(text) {
  const { data } = await client.get('/-/v1/search', {
    params: { text, size: 100 },
  });
  return data.objects.map(({ package }) => ({ name: package.name, version: package.version }));
}

async function getPackage(name, version) {
  if (name.startsWith('@')) {
    // Scoped package, api doesn't work ok for it
    const { data } = await client.get(`/${name}`);
    const pkg = data.versions[version];
    if (!pkg) {
      throw new Error(`Package ${name} has no version ${version}.`);
    }
    return pkg;
  }
  const { data } = await client.get(`/${name}/${version}`);
  return data;
}

module.exports = {
  getPackages,
  getPackage,
};
