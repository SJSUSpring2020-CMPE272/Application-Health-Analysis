const logger = require('tracer').colorConsole();
const _ = require('lodash');
const createError = require('http-errors');
const mongoose = require('mongoose');
const application = require('../db/schema/application').createModel();
const microservice = require('../db/schema/microservice').createModel();
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
                return response.status(401).json({ "messasge": "Invalid credentials" });
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

const onboardApplication = async (request, response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let { name, key, splunk, companyId, dependencies } = request.body;
        let applicationData = await operations.saveDocuments(application, { name, key, splunk, companyId }, { session })
        const applicationId = applicationData._id
        for (dependency of dependencies) {
            const microserviceInfo = {
                "name": Object.keys(dependency)[0],
                "dependencies": dependency[Object.keys(dependency)[0]],
                applicationId
            }
            await operations.saveDocuments(microservice, microserviceInfo, { session })
            var service = new splunkjs.Service(request.body.splunk)
            await service.login();
            var alertOptions = {
                name: name + ' :: Alert for ' + microserviceInfo.name,
                search: "status=" + `${key}_${microserviceInfo.name}_FAILURE`,
                "alert_type": "always",
                "alert.severity": "2",
                "alert.suppress": "0",
                "alert.track": "1",
                "dispatch.earliest_time": "-1h",
                "dispatch.latest_time": "now",
                "is_scheduled": "1",
                "cron_schedule": "* * * * *",
                actions: 'webhook',
                'action.webhook': '1',
                'action.webhook.param.url': process.env.WEBHOOK || 'http://google.com',
            };
            await service.savedSearches().create(alertOptions)
        }
        await session.commitTransaction();
        return response.status(200).json(request.body);
    } catch (ex) {
        await session.abortTransaction();
        logger.error(ex);
        const message = ex.message ? ex.message : 'Error while validating credentials';
        const code = ex.statusCode ? ex.statusCode : 500;
        return response.status(code).json({ message });
    } finally {
        session.endSession();
    }
};

module.exports.testConnection = testConnection;
module.exports.onboardApplication = onboardApplication;
