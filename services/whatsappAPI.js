const { default: axios } = require("axios")

const sendTemplateMessages = async ({ templateName, templateLgCode, components, recipientWhList = [] }) => {

    try {
        const result = await axios.post(`https://api.developer.alliancewatersolutions.com/p/v1/${process.env.DEV_APP_SECRET_KEY}/whatsapp/chat/template`, {
            to: recipientWhList,
            template: {
                name: templateName,
                language: {
                    code: templateLgCode
                },
                components: components
            }
        })

        return result
       
    } catch (error) {
        throw error
    }
}


module.exports = { sendTemplateMessages }