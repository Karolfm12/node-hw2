// const Contact = require("../models/contact");
import Contact from "../models/contact.js";

export const listContacts = async (userId) => {
  return await Contact.find({ owner: userId });
};

export const getContactById = async (userId, contactId) => {
  return await Contact.findOne({ _id: contactId, owner: userId });
};

export const removeContact = async (userId, contactId) => {
  return await Contact.findOneAndRemove({ _id: contactId, owner: userId });
};

export const addContact = async (userId, body) => {
  return await Contact.create({ ...body, owner: userId });
};

export const updateContact = async (userId, contactId, body) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    { ...body },
    { new: true }
  );
};

export const updateStatusContact = async (userId, contactId, body) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    { favorite: body.favorite },
    { new: true }
  );
};

// module.exports = {
//   listContacts,
//   getContactById,
//   removeContact,
//   addContact,
//   updateContact,
//   updateStatusContact,
// };
