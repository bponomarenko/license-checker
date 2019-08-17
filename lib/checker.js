const spinner = require('ora')();
const correct = require('correct-license-metadata');
const parse = require('spdx-expression-parse');
const whitelisted = require('spdx-whitelisted');
const { getPackages, getPackage } = require('./repo-client');
const whitelistRaw = require('./whitelist');

const whitelist = whitelistRaw.map(parse);

function getFullName(name, version) {
  return `${name}@${version}`;
}

async function getLicenseMeta(name, version) {
  spinner.start(`Loading ${getFullName(name, version)}`);
  try {
    const { license, licenses } = await getPackage(name, version);
    return { license, licenses };
  } catch (e) {
    spinner.info(`Skipping ${getFullName(name, version)}: load fail`);
  }
  return null;
}

function checkLicenseMeta(meta, fullName) {
  const license = correct(meta);
  if (!license) {
    spinner.warn(`${fullName} has no correct license metadata: ${JSON.stringify(meta)}`);
    return false;
  }

  try {
    const parsed = parse(license);
    if (whitelisted(parsed, whitelist)) {
      spinner.succeed(`${fullName} license is OK (${JSON.stringify(meta)})`);
      return true;
    } else {
      spinner.warn(`${fullName} license not whitelisted: ${license}`);
    }
  } catch(e) {
    spinner.warn(`${fullName} license ${license} is invalid: ${e}`);
  }
  return false;
}

async function check(text) {
  spinner.start('Loading packages');
  try {
    const pkgs = await getPackages(text);
    spinner.succeed('Packages loaded');

    let okCount = 0;
    for(let i = 0; i < pkgs.length; i++) {
      const { name, version } = pkgs[i];
      const meta = await getLicenseMeta(name, version);
      if (meta && checkLicenseMeta(meta, getFullName(name, version))) {
        okCount += 1;
      }
    }

    console.log('\n\n');
    spinner.info(`Whitelisted ${okCount} of ${pkgs.length}`);
  } catch (error) {
    spinner.fail(`Unexpected error: ${error.message || error}`);
  }
}

module.exports = check;
