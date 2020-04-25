const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const microserviceSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true
    },
    name: { type: String, required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "applications" },
    dependencies: { type: Array, required: true }
}, { collection: 'microservices' });

const createModel = function () {
    return mongoose.model("microservices", microserviceSchema)
}

module.exports.createModel = createModel;
