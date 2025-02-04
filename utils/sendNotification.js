const axios = require("axios");

async function sendNotification(accessToken, deviceToken, msg) {
  const url =
    "https://fcm.googleapis.com/v1/projects/ifeel-in-colors/messages:send";

  const message = {
    message: {
      token: deviceToken,
      notification: {
        title: "Hello fff",
        body: msg,
      },
      data: {
        title: "Notification Title",
        body: msg,
        customKey: "customValue",
      },
    },
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; UTF-8",
  };

  try {
    const response = await axios.post(url, message, { headers });
    console.log("Notification sent successfully:", response.data);
    return {
      status_code: response.status,
      response_body: response.data,
    };
  } catch (error) {
    console.error(
      "Error sending notification:",
      error.response?.data || error.message
    );
    return {
      status_code: error.response?.status || 500,
      response_body: error.response?.data || "Server Error",
    };
  }
}

module.exports = sendNotification;
