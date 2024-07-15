import Enquiry from "@/models/Enquiry.js";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();
  await isAdminRequest(req, res);

  if (method === "GET") {
    if (req.query?.id) {
      res.json(await Enquiry.findOne({ _id: req.query.id }));
    } else {
      res.json(await Enquiry.find());
    }
  }
}