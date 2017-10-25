const fetch = require('node-fetch')
require('dotenv').config()

global.btoa = function(str) {
  return new Buffer(str).toString('base64')
}

const serverPilotEndpoint = 'https://api.serverpilot.io/v1/'
const iThemesPath = '/wp-content/plugins/better-wp-security/history.txt'
const { API_KEY, CLIENT_ID } = process.env
const auth = btoa(CLIENT_ID + ':' + API_KEY)

const isNotThrivex = domain => !domain.includes('thrivex.io')
const isNotDeleteMe = domain => !domain.includes('delete')
const isNotDefault = app => !app.name.includes('default')

const fetchApps = () =>
  fetch(serverPilotEndpoint + 'apps', {
    headers: {
      Authorization: `Basic ${auth}`
    }
  })
    .then(res => res.json())
    .then(json =>
      json.data.map(app => ({
        name: app.name,
        domains: app.domains
          .filter(isNotThrivex)
          .filter(isNotDeleteMe)
          .map(domain => `http://${domain}`)
      }))
    )

const fetchDomains = app => {
  const domainsToFetch = app.domains
  domainsToFetch.map(domain => {
    fetch(domain + iThemesPath)
      .then(res => res.status === 200)
      .then(exists => !exists && console.log(app.name, domain))
      .catch(err => {})
  })
}

fetchApps()
  .then(apps => {
    console.log(`
    Checking ${apps.length} apps.
    Cannot find iThemes installed on the following domains.
  `)
    return apps
  })
  .then(apps => apps.filter(isNotDefault).map(fetchDomains))
