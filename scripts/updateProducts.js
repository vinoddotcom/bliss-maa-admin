require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;
const { OpenAI } = require("openai");
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your .env file
});

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "eu-central-1",
});

// Define Product schema (copied from your existing model)
const ProductSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    purpose: String,
    images: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: "Category" },
    properties: { type: Object },

    // 🚀 SEO fields
    slug: { type: String, required: true, unique: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    shortDescription: { type: String },
  },
  {
    timestamps: true,
  }
);

function generateOilPrompt(oilName) {
  const oilSourceMap = {
    "Lavender Oil": "flower",
    "Rose Oil": "flower",
    "Lemongrass Oil": "leaf",
    "Basil Oil": "leaf",
    "Black Seed Oil /Kalonji Oil": "seed",
    "Rosehip Oil": "fruit (rosehip)",
    "Bergamot oil": "fruit peel",
    "Chamomile Oil": "flower",
    "Lemon Oil": "fruit peel",
    "Eucalyptus oil": "leaf",
    "Ylang Ylang oil": "flower",
    "Frankincense oil": "resin",
    "Rosemary Oil": "leaf",
    "Tea Tree Oil": "leaf",
    "Sunflower oil": "seed",
    "Sesame Oil": "seed",
    "Almond Oil": "nut (kernel)",
    "Argan Oil": "nut (kernel)",
    "Apricot Oil": "kernel (inside pit)",
    "Avocado Oil": "fruit (pulp)",
    "Pine oil": "needle or wood",
    "Walnut Oil": "nut (kernel)",
    "Linseed Oil": "seed (flaxseed)",
    "Castor Oil": "seed",
    "Olive Oil": "fruit (olive pulp)",
    "Coconut Oil": "kernel (white flesh)",
    "Grapeseed Oil": "seed",
    "Jojoba Oil": "seed",
    "Sweet Almond Oil": "nut (kernel)",
    "Thyme Oil": "leaf",
  };

  const source =
    oilSourceMap[oilName] || "plant element (seed, flower, herb, or fruit)";
  const cleanName = oilName.replace(/oil/gi, "").trim();

  return [
    `Create a high-resolution, realistic image of natural ${cleanName} ${source} — either a single ${source} or a small natural cluster, depending on actual size. Place them on a pure white background, ensuring the subject appears fully intact and not cropped or cut off. The ${source} should look fresh, clean, and organic, with no stems, packaging, or distracting elements. Use soft, diffused lighting with minimal shadows to give a clean, premium, cut-out feel, as if the object could be lifted directly from the background. Ensure the scale reflects the true-to-life size of real ${cleanName} ${source}.`,
    `Create a high-resolution, premium-quality, realistic image of golden ${cleanName} oil being freshly extracted from its natural source — the ${source} — into a small, transparent glass jar positioned on a pure white surface. The oil should appear rich, glossy, and slightly golden-tinted as it flows naturally and smoothly from the raw ${source} above. Ensure the ${source} is clearly visible, whole, and true to its natural form without being cropped or visually altered. Use soft, diffused lighting with minimal shadows to convey a clean, luxurious, and health-focused aesthetic. The entire scene should feel organic and elegant, with no branding, text, labels, or visual distractions — only the raw ingredients and oil in a natural, product-focused composition.`,
  ];
}

// Register the model
const Product = models?.Product || model("Product", ProductSchema);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function generateSEOContent(productName) {
  const functions = [
    {
      name: "generate_seo_content",
      description: "Generate SEO fields for essential oil bulk product",
      parameters: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "URL-friendly slug of the product",
          },
          metaTitle: {
            type: "string",
            description: "SEO meta title under 60 characters",
          },
          metaDescription: {
            type: "string",
            description: "SEO meta description under 155 characters",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "List of 5 relevant keywords",
          },
          shortDescription: {
            type: "string",
            description: "2–3 sentence product summary for marketing",
          },
        },
        required: [
          "slug",
          "metaTitle",
          "metaDescription",
          "keywords",
          "shortDescription",
        ],
      },
    },
  ];

  const prompt = `
        Generate SEO content for the following essential oil offered in bulk deals.

        Product Name: ${productName}

        Audience: B2B buyers, wholesalers, cosmetic and aromatherapy brands.

        Please respond using the provided function schema. Make sure it's unique, compelling, and suitable for product listings.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [{ role: "user", content: prompt }],
      functions,
      function_call: { name: "generate_seo_content" },
    });

    const args = JSON.parse(
      response.choices[0].message.function_call.arguments
    );

    return {
      slug: args.slug || createSlug(productName),
      metaTitle: args.metaTitle || productName,
      metaDescription: args.metaDescription || "",
      keywords: args.keywords || [],
      shortDescription: args.shortDescription || "",
    };
  } catch (error) {
    console.error(`Failed to generate SEO for: ${productName}`, error);
    return {
      slug: createSlug(productName),
      metaTitle: productName,
      metaDescription: "",
      keywords: [],
      shortDescription: "",
    };
  }
}

async function uploadToS3(imageBuffer, fileName) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: imageBuffer,
    ContentType: "image/jpeg",
    // ACL: "public-read",
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
  } catch (error) {
    console.error("Failed to upload image to S3:", error);
    // Fallback: save image locally in ./images folder
    const imagesDir = path.join(__dirname, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir);
    }
    const randomNum = Math.floor(Math.random() * 1000000);
    const localPath = path.join(imagesDir, `${randomNum}_${fileName}`);
    try {
      fs.writeFileSync(localPath, imageBuffer);
      console.log(`Image saved locally at ${localPath}`);
      // Return a local file URL or path
      return `file://${localPath}`;
    } catch (fsError) {
      console.error("Failed to save image locally:", fsError);
      throw fsError;
    }
  }
}

// Generate images using OpenAI
async function generateImages(productTitle) {
  const cleanName = productTitle.replace(/oil/gi, "").trim();
  const baseName = cleanName
    .replace(/[^a-zA-Z0-9 ]/g, "") // Remove all special characters except letters, numbers, and spaces
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .toLowerCase();
  const [prompt1, prompt2] = generateOilPrompt(productTitle);

  console.log("[generateImages] Prompts generated prompt1:", prompt1);
  console.log("[generateImages] Prompts generated prompt2:", prompt2);

  try {
    // Generate both images in parallel
    const [response1, response2] = await Promise.all([
      openai.images.generate({ prompt: prompt1, n: 1, size: "512x512" }),
      openai.images.generate({ prompt: prompt2, n: 1, size: "512x512" }),
    ]);

    const imageUrls = [response1.data[0].url, response2.data[0].url];
    const uploadedUrls = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const imageResponse = await axios.get(url, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(imageResponse.data, "binary");
      const fileName = `${baseName}_image_${i + 1}.jpg`;
      const s3Url = await uploadToS3(imageBuffer, fileName); // Ensure this uploads and returns a public URL
      uploadedUrls.push(s3Url);
    }

    return uploadedUrls;
  } catch (error) {
    console.error(
      `Failed to generate images for product "${productTitle}":`,
      error
    );
    return [
      "https://placehold.co/512x512?text=Fallback+Image+1",
      "https://placehold.co/512x512?text=Fallback+Image+2",
    ];
  }
}

// Update a single product by ID
async function updateProductById(productId) {
  console.log("[updateProductById] Start", productId);
  try {
    // Fetch the product by ID
    console.log("[updateProductById] Fetching product from DB...");
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`[updateProductById] Product not found: ${productId}`);
      return;
    }
    console.log(
      `[updateProductById] Processing product: ${product.title} (${product._id})`
    );

    // Generate SEO content
    // Only generate SEO content if any field is missing
    let seoContent = {
      slug: product.slug,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      keywords: product.keywords,
      shortDescription: product.shortDescription,
    };

    const needsSEO =
      !seoContent.slug ||
      !seoContent.metaTitle ||
      !seoContent.metaDescription ||
      !seoContent.keywords ||
      seoContent.keywords.length === 0 ||
      !seoContent.shortDescription;

    if (needsSEO) {
      console.log("[updateProductById] Generating SEO content...");
      seoContent = await generateSEOContent(product.title);
    } else {
      console.log("[updateProductById] Using existing SEO content");
    }

    console.log(
      `[updateProductById] SEO content ${needsSEO ? "generated" : "used"}:`,
      seoContent
    );

    // Generate images
    console.log("[updateProductById] Generating images...");
    const generatedImages = await generateImages(product.title);
    console.log("[updateProductById] Images generated:", generatedImages);

    // Update the product
    console.log("[updateProductById] Updating product in DB...");
    await Product.updateOne(
      { _id: product._id },
      {
        images: generatedImages,
        slug: seoContent.slug,
        metaTitle: seoContent.metaTitle,
        metaDescription: seoContent.metaDescription,
        keywords: seoContent.keywords,
        shortDescription: seoContent.shortDescription,
      }
    );
    console.log(`✅ [updateProductById] Updated product: ${product.title}`);
  } catch (error) {
    console.error(
      `[updateProductById] Failed to update product ${productId}:`,
      error
    );
  }
  console.log("[updateProductById] End", productId);
}

// Fetch all products and update them one by one
// async function updateAllProducts() {
//   try {
//     await connectToMongoDB();
//     const products = await Product.find({});
//     console.log(`Found ${products.length} products to update`);
//     for (const product of products) {
//       await updateProductById(product._id);
//     }
//     console.log('All products updated successfully!');
//   } catch (error) {
//     console.error('Error in updateAllProducts:', error);
//   } finally {
//     await mongoose.connection.close();
//     console.log('MongoDB connection closed');
//   }
// }

// // Run the update function
// updateAllProducts();

console.log("[main] Script started");
connectToMongoDB().then(() => {
  updateProductById("655b069e6aac15dc885eb229")
    .then(() => {
      console.log("[main] Script finished");
      mongoose.connection.close();
    })
    .catch((err) => {
      console.error("[main] Error in updateProductById:", err);
      mongoose.connection.close();
    });
});
