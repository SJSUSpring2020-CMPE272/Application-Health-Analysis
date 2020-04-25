const logger = require('tracer').colorConsole();
const _ = require('lodash');
const createError = require('http-errors');
const project = require('../db/schema/company').createModel();
const operations = require('../db/operations');
var splunkjs = require('splunk-sdk');

const testConnection = async (request, response) => {
    try {
        var service = new splunkjs.Service({
            username: request.body.username,
            password: request.body.password,
            scheme: request.body.protocol,
            host: request.body.host,
            port: request.body.port

        });
        service.login(function (err, success) {
            if (err) {
                return response.status(401).json({ "messasge": "Inalid credentials" });
            }
            return response.status(200).json({ "messasge": "valid credentials" });
        })
    } catch (ex) {
        logger.error(ex);
        const message = ex.message ? ex.message : 'Error while validating credentials';
        const code = ex.statusCode ? ex.statusCode : 500;
        return response.status(code).json({ message });
    }
};

module.exports.testConnection = testConnection;
