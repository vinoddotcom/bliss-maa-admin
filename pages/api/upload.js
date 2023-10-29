import multiparty from "multiparty";
import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";
const bucketName = "essentail-oil";

export default async function handle(req, res) {
   const { method } = req;
  await mongooseConnect();
  await isAdminRequest(req, res);

  const client = new S3Client({
    region: "ap-south-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  if(method === "DELETE") {
    const imageUrl = req.query?.imageUrl;
    if(!imageUrl) return res.json({ statusCode: 401, message: "image url not found", success: false })
    const simplifiedKey = imageUrl.split('/').slice(3).join('/');
    const params = {
      Bucket: bucketName,
      Key: simplifiedKey,
    };

    await client.send(new DeleteObjectCommand(params))
    return res.json({ success: true });
  }

  const form = new multiparty.Form();
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });

  const links = [];
  for (const file of files.file) {
    const ext = file.originalFilename.split(".").pop();
    const newFilename = Date.now() + "." + ext;
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: newFilename,
        Body: fs.readFileSync(file.path),
        ACL: "public-read",
        ContentType: mime.lookup(file.path),
      })
    );

    const link = `https://${bucketName}.s3.amazonaws.com/${newFilename}`;
    links.push(link);
  }
  return res.json({ links });
}

export const config = {
  api: { bodyParser: false },
};
