const cds = require('@sap/cds');
const cloudSDK = require('@sap-cloud-sdk/core');
const axios = require('axios');

module.exports = (srv) => {
    srv.on('sendNotification', async (req) => {
        const { roleName, NotificationType } = req.data;

        try {
            // Get destination configuration for role_matrix
            const destinationRoleMatrix = await cloudSDK.getDestination('role_matrix');
            const requestConfigRoleMatrix = await cloudSDK.buildHttpRequest(destinationRoleMatrix);
            console.log('destination working');

            requestConfigRoleMatrix.method = 'GET';
            requestConfigRoleMatrix.url = `/v2/odata/v4/catalog/Role_Matrix?$filter=Role eq '${roleName}'`;

            // Fetch the email based on the roleName from role_matrix service
            const roleResponse = await axios.request(requestConfigRoleMatrix).catch(function(oerror){
                return req.error({
                    code : 417,
                    message: oerror.message
                })
                
                
            });

            console.log('data successfull');
            console.log(roleResponse.data);
;

            // if (!roleResponse.data.value || roleResponse.data.value.length === 0) {
            //     throw new Error(`No email found for role: ${roleName}`);
            // }

            const email = roleResponse.data.d.results[0].Email;
            console.log('email received');
            console.log(email);


            // Get destination configuration for Email_notification_utility
            const emailDestination = await cloudSDK.getDestination('Email_notification_utility');
            const emailRequestConfig = await cloudSDK.buildHttpRequest(emailDestination);

            emailRequestConfig.method = 'POST';
            emailRequestConfig.url = `/odata/v4/catalog/sendmail`;
            emailRequestConfig.data = {
                to: email,
                subject: `Notification: ${NotificationType}`,
                templetType: NotificationType
            };

            // Send the email using the Email_notification_utility service
            const emailContentResponse = await axios.request(emailRequestConfig);

            if (emailContentResponse.status !== 200) {
                throw new Error('Failed to send email.');
            }

            return "Notification sent successfully.";
        } catch (error) {
            console.error(error);
            return `Error sending notification: ${error.message}`;
        }
    });
};