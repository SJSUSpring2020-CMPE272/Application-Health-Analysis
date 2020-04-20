const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
}, { collection: 'admin' });

const createModel = function () {
    return mongoose.model("admin", adminSchema)
}

module.exports.createModel = createModel;