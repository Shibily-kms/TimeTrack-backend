const { default: axios } = require("axios")

const sendTemplateMessages = ({ templateName, templateLgCode, components, recipientWhList = [] }) => {
    try {
        recipientWhList?.map(async (whatsappNumber) => {

            await axios.post(`${process.env.WA_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
                messaging_product: "whatsapp",
                to: whatsappNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: templateLgCode
                    },
                    components: components
                }
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            })
        })

    } catch (error) {
        console.log(error, 'whatsapp error')
    }
}


module.exports = { sendTemplateMessages }