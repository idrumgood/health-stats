const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

async function generateInsights(stravaData, whoopData) {
    if (!process.env.GEMINI_API_KEY) {
        return "Gemini API key is not configured. Add GEMINI_API_KEY to your .env file to enable AI insights.";
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
            You are a highly intelligent health and fitness coach. Analyze this data and provide 3-4 insightful paragraphs looking for trends.

            Strava Data: ${JSON.stringify(stravaData.slice(0, 10))}
            Whoop Data: ${JSON.stringify(whoopData.slice(0, 10))}
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "An error occurred while generating insights.";
    }
}

module.exports = { generateInsights };
