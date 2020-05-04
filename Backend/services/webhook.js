const logger = require('tracer').colorConsole();
const _ = require('lodash');
const createError = require('http-errors');
const mongoose = require('mongoose');
const application = require('../db/schema/application').createModel();
const failueLogDetails = require('../db/schema/cuurentFailureLogDetails').createModel();
const failureLogDetailsHistory = require('../db/schema/failureLogHistory').createModel();
const microservice = require('../db/schema/microservice').createModel();
const operations = require('../db/operations');
var splunkjs = require('splunk-sdk');

const onAlert = async (request, response) => {
    try {
        console.log(request);


        let microServiceName = JSON.parse(request.body.result._raw).message.status.split('_')[1];
        let logObject = {
            searchKey: JSON.parse(request.body.result._raw).message.status,
            failedApi: JSON.parse(request.body.result._raw).message.api,
            failureTime: request.body.result._time,
            logData: {
                failureTime: request.body.result._time,
                data: JSON.parse(request.body.result._raw).message.log
            }
        }
        handleFailureAlert(logObject, microServiceName);

        return response.status(200).json({ "messasge": "valid credentials" });

    } catch (ex) {
        logger.error(ex);
        const message = ex.message ? ex.message : 'Error while validating credentials';
        const code = ex.statusCode ? ex.statusCode : 500;
        return response.status(code).json({ message });
    }
};


const onSuccessAlert = async (request, response) => {
    try {
        console.log(request);
        var service = new splunkjs.Service(request.body.splunk)
        let searchName = request.body.search_name;
        service.savedSearches().fetch(function (err, firedAlertGroups) {
            if (err) {
                console.log("There was an error in fetching the alerts");
                done(err);
                return;
            }
            var alertToDelete = firedAlertGroups.item(searchName);
            if (!alertToDelete) {
            }
            else {
                alertToDelete.remove();
                console.log("Deleted");
            }
        });
        let logObject = {
            searchKey: JSON.parse(request.body.result._raw).message.status,
            failedApi: JSON.parse(request.body.result._raw).message.api,
            successTime: request.body.result._time,
            logData: {
                failureTime: request.body.result._time,
                data: JSON.parse(request.body.result._raw).message.log
            }
        }
        let microServiceName = JSON.parse(request.body.result._raw).message.status.split('_')[1];
        let microServiceObj = operations.findDocumentsByQuery(microservice, { name: microServiceName }, { _id: 1 });
        let failiedLogData = operations.findDocumentsByQuery(failueLogDetails, { failedMicroervice: microServiceObj[0]._id, failedApi: logObject.failedApi });
        operations.deleteDocument(failueLogDetails, failiedLogData._id);
        let historyObj = {
            name: failiedLogData.name,
            failureTime: failiedLogData.failureTime,
            severity: failiedLogData.severity,
            successTime: logObject.successTime,
            failureCount: failiedLogData.failureCount,
            failedApi: failiedLogData.failedApi,
            failedMicroervice: failiedLogData.failedMicroervice,
            failureData: failiedLogData.failureData
        }
        operations.saveDocuments(failureLogDetailsHistory,historyObj,{ runValidators: true })

        // handleFailureAlert(logObject, microServiceName);

        return response.status(200).json({ "messasge": "done" });

    } catch (ex) {
        logger.error(ex);
        const message = ex.message ? ex.message : 'Error while validating credentials';
        const code = ex.statusCode ? ex.statusCode : 500;
        return response.status(code).json({ message });
    }
}

const handleFailureAlert = async (logObject, microServiceName) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {

        let logDetails = await operations.findDocumentsByQuery(failueLogDetails, { failedApi: logObject.failedApi }, { failureCount: 1, _id: 1 });
        if (!logDetails.length) {
            let result = await operations.updateField(failueLogDetails, { _id: logDetails._id }, { $set: { failureCount: logDetails + 1 }, $push: { failureData: logObject.logData } });

        }
        else {
            let searchKey = logObject.searchKey.replace('failure', 'success');
            searchKey = `*${logObject.failedApi}*${searchKey}*`;
            var service = new splunkjs.Service(request.body.splunk)
            await service.login();
            var alertOptions = {
                name: name + ' :: Alert for ' + microserviceInfo.name,
                search: searchKey,
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

        }
        await session.commitTransaction();
        return response.status(200).json(request.body);

    }

    catch (ex) {
        await session.abortTransaction();
        logger.error(ex);
        const message = ex.message ? ex.message : 'Error while validating credentials';
        const code = ex.statusCode ? ex.statusCode : 500;
        return response.status(code).json({ message });
    } finally {
        session.endSession();
    }

};

// const handleFailureAlert = async (logObject , microServiceName) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//         let { name, key, splunk, companyId, dependencies } = request.body;
//         let applicationData = await operations.saveDocuments(application, { name, key, splunk, companyId }, { session })
//         const applicationId = applicationData._id
//         for (dependency of dependencies) {
//             const microserviceInfo = {
//                 "name": Object.keys(dependency)[0],
//                 "dependencies": dependency[Object.keys(dependency)[0]],
//                 applicationId
//             }
//             await operations.saveDocuments(microservice, microserviceInfo, { session })
//             var service = new splunkjs.Service(request.body.splunk)
//             await service.login();
//             var alertOptions = {
//                 name: name + ' :: Alert for ' + microserviceInfo.name,
//                 search: "status=" + `${key}_${microserviceInfo.name}_FAILURE`,
//                 "alert_type": "always",
//                 "alert.severity": "2",
//                 "alert.suppress": "0",
//                 "alert.track": "1",
//                 "dispatch.earliest_time": "-1h",
//                 "dispatch.latest_time": "now",
//                 "is_scheduled": "1",
//                 "cron_schedule": "* * * * *",
//                 actions: 'webhook',
//                 'action.webhook': '1',
//                 'action.webhook.param.url': process.env.WEBHOOK || 'http://google.com',
//             };
//             await service.savedSearches().create(alertOptions)
//         }
//         await session.commitTransaction();
//         return response.status(200).json(request.body);
//     } catch (ex) {
//         await session.abortTransaction();
//         logger.error(ex);
//         const message = ex.message ? ex.message : 'Error while validating credentials';
//         const code = ex.statusCode ? ex.statusCode : 500;
//         return response.status(code).json({ message });
//     } finally {
//         session.endSession();
//     }
// };

module.exports.onAlert = onAlert;
module.exports.onSuccessAlert = onSuccessAlert ;