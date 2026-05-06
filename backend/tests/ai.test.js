const { generateInsights } = require('../ai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock the external dependency
jest.mock('@google/generative-ai');

describe('AI Insights', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules(); // clears the cache
        process.env = { ...originalEnv }; // make a copy
    });

    afterAll(() => {
        process.env = originalEnv; // restore original env
    });

    test('should return a message if GEMINI_API_KEY is not configured', async () => {
        delete process.env.GEMINI_API_KEY;

        const result = await generateInsights([], []);
        expect(result).toBe("Gemini API key is not configured. Add GEMINI_API_KEY to your .env file to enable AI insights.");
    });

    test('should return text from Gemini API successfully', async () => {
        process.env.GEMINI_API_KEY = 'fake-key';

        const mockGenerateContent = jest.fn().mockResolvedValue({
            response: { text: () => 'These are some mock insights.' }
        });

        const mockGetGenerativeModel = jest.fn().mockReturnValue({
            generateContent: mockGenerateContent
        });

        // The genAI instance is created on module load, so we need to mock the constructor
        // Ensure GoogleGenerativeAI is fully mocked before isolating modules
        jest.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel
            }))
        }));

        let generateInsights;
        jest.isolateModules(() => {
            const aiModule = require('../ai');
            generateInsights = aiModule.generateInsights;
        });

        const stravaData = [{ id: 1, type: 'Run' }];
        const whoopData = [{ id: 1, strain: 10 }];

        const result = await generateInsights(stravaData, whoopData);

        expect(result).toBe('These are some mock insights.');
        expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-3-flash-preview' });
        expect(mockGenerateContent).toHaveBeenCalled();

        const callArgs = mockGenerateContent.mock.calls[0][0];
        expect(callArgs).toContain('Strava Data');
        expect(callArgs).toContain('Whoop Data');
    });

    test('should handle Gemini API errors gracefully', async () => {
        process.env.GEMINI_API_KEY = 'fake-key';

        const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API failure'));

        const mockGetGenerativeModel = jest.fn().mockReturnValue({
            generateContent: mockGenerateContent
        });

        jest.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel
            }))
        }));

        let generateInsights;
        jest.isolateModules(() => {
            const aiModule = require('../ai');
            generateInsights = aiModule.generateInsights;
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const result = await generateInsights([], []);

        expect(result).toBe('An error occurred while generating insights.');
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
