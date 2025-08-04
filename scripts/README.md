# Product Update Script

This standalone Node.js script updates all products in your database by:
1. Replacing existing images with two new placeholder images
2. Generating SEO fields using ChatGPT:
   - slug
   - metaTitle
   - metaDescription
   - keywords
   - shortDescription

## Setup

1. Install dependencies:
   ```
   npm install dotenv mongoose openai
   ```

2. Set up environment variables:
   ```
   bash setup-env.sh
   ```
   Then edit the `.env` file with your MongoDB URI and OpenAI API key.

## Usage

Run the script with:
```
node updateProducts.js
```

## How It Works

The script connects to your MongoDB database, fetches all products, and updates each one with:
- New placeholder images (you can change these to your actual image URLs)
- SEO content generated with OpenAI's GPT-4 model

If the OpenAI API call fails for any reason, the script will fall back to generating a basic slug from the product title and use existing product data for the other fields.

## Customization

- Change the placeholder image URLs in `sampleImages` array
- Modify the ChatGPT prompt in `generateSEOContent()` function
- Adjust the MongoDB connection settings as needed
