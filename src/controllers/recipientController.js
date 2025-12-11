const { where } = require("sequelize");
const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");


exports.createRecipient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      type,
      companyName,
      gstNumber,
      status = 'Active',
      user_id
    } = req.body;

    // 1. Validate required fields
    if (!name || !email || !type || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, type, and user_id are required"
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // 3. Validate phone number format (if provided)
    if (phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format"
        });
      }
    }

    // 4. Validate type
    const validTypes = ['individual', 'company'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'individual' or 'company'"
      });
    }


    // 6. Check if email already exists for this user
    const existingRecipient = await db.models.Recipient.findOne({
      where: {
        email,
        user_id
      }
    });

    if (existingRecipient) {
      return res.status(409).json({
        success: false,
        message: "A recipient with this email already exists"
      });
    }

    // 9. Prepare data for creation
    const recipientData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      type: type.toLowerCase(),
      companyName: companyName ? companyName.trim() : null,
      gstNumber: gstNumber ? gstNumber.toUpperCase().trim() : null,
      status,
      user_id
    };

    // 10. Create recipient
    const response = await myServices.create(db.models.Recipient, recipientData);

    // 11. Check if creation was successful
    if (response && response.success) {
      return res.status(201).json({
        success: true,
        message: "Recipient created successfully",
        data: response.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: response?.message || "Failed to create recipient"
      });
    }

  } catch (error) {
    console.error("Error creating recipient:", error);

    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "A recipient with this email already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getRecipient = async (req, res) => {
  const response = await myServices.read(db.models.Recipient, req.params.id);
  res.json(response);
};

exports.updateRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      type,
      companyName,
      gstNumber,
      status,
      user_id,
      country,
      zip,
      city,
      state
    } = req.body;

    console.log("i am from body ", req.body);


    // 1. Validate ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required"
      });
    }

    // 2. Check if recipient exists and belongs to user
    const recipient = await db.models.Recipient.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found or you don't have permission to update it"
      });
    }

    // 3. Prepare update data
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      // Check if email already exists for other recipients of same user
      const existingRecipient = await db.models.Recipient.findOne({
        where: {
          email: email.toLowerCase().trim(),
          user_id,
          id: { [Op.ne]: id }
        }
      });

      if (existingRecipient) {
        return res.status(409).json({
          success: false,
          message: "A recipient with this email already exists"
        });
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format"
        });
      }
      updateData.phone = phone.trim();
    }

    if (type) {
      const validTypes = ['individual', 'company'];
      if (!validTypes.includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be 'individual' or 'company'"
        });
      }
      updateData.type = type.toLowerCase();
    }

    if (status) {
      const validStatuses = ['Active', 'Inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'Active' or 'Inactive'"
        });
      }
      updateData.status = status;
    }

    if (companyName) updateData.companyName = companyName.trim();
    if (gstNumber) updateData.gstNumber = gstNumber.trim();
    if (country) updateData.country = country.trim();
    if (zip) updateData.zip = zip.trim();
    if (city) updateData.city = city.trim();
    if (state) updateData.state = state.trim();

    // 4. Update recipient
    const response = await myServices.update(db.models.Recipient, id, updateData);

    // 5. Return response
    if (response && response.success) {
      return res.json({
        success: true,
        message: "Recipient updated successfully",
        data: response.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: response?.message || "Failed to update recipient"
      });
    }

  } catch (error) {
    console.error("Error updating recipient:", error);

    // Handle specific errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "A recipient with this email already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteRecipient = async (req, res) => {
  const response = await myServices.delete(db.models.Recipient, req.params.id);
  res.json(response);
};

// recipient list where userId = req.user.id
exports.listRecipients = async (req, res) => {
  try {
    const { user_id } = req.query;

    // console.log("user_id:", user_id);


    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const recipients = await db.models.Recipient.findAll({
      where: { user_id },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: recipients.length,
      data: recipients,
    });
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};