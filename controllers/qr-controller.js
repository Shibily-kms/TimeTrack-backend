const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const QrGenModel = require('../models/qr-generator-list')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { createRandomId } = require('../helpers/id-helper')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')

const getSingleQrCode = async (req, res, next) => {
    try {

        const { qrId } = req.query

        if (!qrId) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const findData = await QrGenModel.findOne({ qrId: qrId })

        if (YYYYMMDDFormat(new Date()) > findData.expire_date) {
            return res.status(400).json(errorResponse('This QR Code Expired', 400))
        }

        if (findData.delete || !findData) {
            return res.status(404).json(errorResponse('Invalid QR Code Id', 404))
        }

        res.status(201).json(successResponse('Qr Code data', findData))
    } catch (error) {
        next(error)
    }
}

const getAllQrList = async (req, res, next) => {
    try {
        const { type } = req.query

        if (!type) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const qrList = await QrGenModel.find({
            qr_type: type,
            $nor: [
                { delete: { $lte: new Date(new Date().setDate(new Date().getDate() - 5)) } },
                { expire_date: { $lte: YYYYMMDDFormat(new Date(new Date().setDate(new Date().getDate() - 5))) } }
            ]
        })

        res.status(201).json(successResponse('QR code list', qrList))
    } catch (error) {
        next(error)
    }
}

const createQRCode = async (req, res, next) => {
    try {
        const { qr_type, name, expire_until } = req.body

        if (!qr_type || !name || !expire_until) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const obj = {
            qrId: createRandomId(12, 'qr_'),
            qr_type: qr_type,
            name: name,
            expire_date: YYYYMMDDFormat(new Date(new Date().setDate(new Date().getDate() + Number(expire_until || 0)))),
            used_count: 0
        }

        const qrCode = await QrGenModel.create(obj)

        res.status(201).json(successResponse('New Qr Code Created', qrCode))

    } catch (error) {
        next(error)
    }
}

const deleteQRCode = async (req, res, next) => {
    try {
        const { _id } = req.query

        if (!_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const findData = await QrGenModel.findOne({ _id: new ObjectId(_id) })

        if (YYYYMMDDFormat(new Date()) > findData.expire_date) {
            return res.status(400).json(errorResponse('This QR Code Expired', 400))
        }

        if (findData.delete) {
            return res.status(404).json(errorResponse('This QR Code Already Deleted', 404))
        }

        if (!findData) {
            return res.status(404).json(errorResponse('Invalid Qr ID', 404))
        }

        if (findData.used_count > 0) {
            await QrGenModel.updateOne({ _id: new ObjectId(_id) }, {
                $set: {
                    delete: new Date()
                }
            })
        } else {
            await QrGenModel.deleteOne({ _id: new ObjectId(_id) })
        }

        res.status(201).json(successResponse('Deleted'))


    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllQrList, createQRCode, deleteQRCode, getSingleQrCode
}