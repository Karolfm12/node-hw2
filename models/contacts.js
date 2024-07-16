const { Schema, model } = require("mongoose");

const contactSchema = new Schema({
  name: {
    type: String,
    required: [true, "Set name for contact"],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});

const Contact = model("Contact", contactSchema);

const listContacts = async (userId) => {
  return await Contact.find({ owner: userId });
};

const getContactById = async (contactId, userId) => {
  return await Contact.findOne({ _id: contactId, owner: userId });
};

const removeContact = async (contactId, userId) => {
  return await Contact.findOneAndRemove({ _id: contactId, owner: userId });
};

const addContact = async (body) => {
  return await Contact.create(body);
};

const updateContact = async (contactId, body, userId) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    body,
    { new: true }
  );
};

const updateStatusContact = async (contactId, body, userId) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    body,
    { new: true }
  );
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
