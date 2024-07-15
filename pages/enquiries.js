import React, { useState, useMemo, useEffect } from "react";
// import { format, parseISO } from 'date-fns';
import Layout from "@/components/Layout";
import axios from "axios";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-US", options);
};

// Custom date parsing function (for sorting)
const parseDate = (dateString) => new Date(dateString).getTime();

const EnquiryList = () => {
  const [enquiries, setEnquiries] = useState([]);
  useEffect(() => {
    axios.get("/api/enquiries").then((response) => {
      console.log(response.data, "response.data");
      setEnquiries(response.data);
    });
  }, []);

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const handleEnquiryClick = (enquiry) => {
    setSelectedEnquiry(enquiry);
  };

  const closeDetails = () => {
    setSelectedEnquiry(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const filteredAndSortedEnquiries = useMemo(() => {
    return enquiries
      .filter(
        (enquiry) =>
          enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = parseDate(a.time);
        const dateB = parseDate(b.time);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [enquiries, searchTerm, sortOrder]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Enquiries</h1>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search enquiries..."
            className="p-2 border rounded-md mb-2 sm:mb-0 sm:mr-4 flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={toggleSortOrder}
          >
            Sort by Date (
            {sortOrder === "desc" ? "Newest First" : "Oldest First"})
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedEnquiries.map((enquiry, index) => (
            <EnquiryCard
              key={index}
              enquiry={enquiry}
              onClick={() => handleEnquiryClick(enquiry)}
            />
          ))}
        </div>
        {selectedEnquiry && (
          <EnquiryDetails enquiry={selectedEnquiry} onClose={closeDetails} />
        )}
      </div>
    </Layout>
  );
};

const EnquiryCard = ({ enquiry, onClick }) => {
  return (
    <div
      className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={onClick}
    >
      <h2 className="text-xl font-semibold mb-2">{enquiry.name}</h2>
      <p className="text-gray-600 mb-2">{enquiry.email}</p>
      <p className="text-gray-500 text-sm">{formatDate(enquiry.time)}</p>
    </div>
  );
};

const EnquiryDetails = ({ enquiry, onClose }) => {
    const [product, setProduct] = useState(null); // Initial state with explicit null value
    useEffect(() => {
      const fetchData = async () => {
        if (enquiry?.productId) {
          try {
            const response = await axios.get(`/api/products?id=${enquiry?.productId}`);
            setProduct(response.data);
            console.log("response.data", response.data)
          } catch (error) {
            console.error("Error fetching product:", error);
          }
        }
      };
    
      fetchData(); // Call the function immediately to fetch data on component mount
    }, [enquiry?.productId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">{enquiry.name}</h2>
        <p className="mb-2">
          <span className="font-semibold">Email:</span> {enquiry.email}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Phone:</span> {enquiry.phoneNumber}
        </p>
        <p className="mb-4">
          <span className="font-semibold">Time:</span>{" "}
          {formatDate(enquiry.time)}
        </p>
        <p className="mb-4">
          <span className="font-semibold">Message:</span> {enquiry.message}
        </p>
        {enquiry.productId && (
          <p className="mb-4">
            <span className="font-semibold">Product ID:</span>{" "}
            {enquiry.productId}
          </p>
        )}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EnquiryList;
