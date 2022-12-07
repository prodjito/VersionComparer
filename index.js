const { request, gql } = require('graphql-request')
const cmp = require('semver-compare')

const ACCOUNT_ID = process.env.ACCOUNT_ID
const USER_API_KEY = process.env.USER_API_KEY

//Set to the min req for 8T and should be changed as necessary
const MIN_AGENT_VERSIONS = new Map([
    ["go", '3.5.0'],
    ["java", '5.12.0'],
    ["nodejs", '6.6.0'],
    ["python", '5.12.0.140'],
    ["dotnet", '8.26.630.0'],
    ["ruby", '6.11.0'],
    ["php", '9.11.0.267'],
])

const REQUEST_HEADERS = {
    'Content-Type' : 'application/json',
    'API-Key': USER_API_KEY,
}

let query = gql`{
    actor {
        account(id: ${ACCOUNT_ID}) {
            nrql(query: "SELECT uniqueCount(agentHostname) FROM NrDailyUsage WHERE apmAgentVersion IS NOT NULL FACET apmLanguage, apmAgentVersion SINCE 1 day AGO LIMIT MAX") {
                results
            }
        }
    }
}`

request('https://api.newrelic.com/graphql', query, null, REQUEST_HEADERS).then((summaryData) => {
    summaryData.actor.account.nrql.results.forEach(result => {
        language = result.facet[0]
        version = result.facet[1]
        if(cmp(MIN_AGENT_VERSIONS.get(language), version) == 1) {
            console.log(`${language} ${version} host count: ${result['uniqueCount.agentHostname']}`)
            console.log(`SELECT uniques(agentHostname) FROM NrDailyUsage WHERE apmLanguage = '${language}' AND apmAgentVersion = '${version}' SINCE 1 day AGO`)
        }
    })
})