const express = require("express");
const Invoice = require("../models/Invoice");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE INVOICE
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            invoiceNumber,
            client,
            dueDate,
            tax,
            subtotal,
            taxAmount,
            total,
            status,
            items
        } = req.body;

        if (
            !invoiceNumber ||
            !client ||
            !dueDate ||
            subtotal === undefined ||
            taxAmount === undefined ||
            total === undefined ||
            !items ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Required invoice fields are missing"
            });
        }

        const invoice = await Invoice.create({
            invoiceNumber,
            client,
            dueDate,
            tax: tax || 0,
            subtotal,
            taxAmount,
            total,
            status: status || "Draft",
            items,
            user: req.user.userId
        });

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Invoice number already exists"
            });
        }

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// GET ALL INVOICES
router.get("/", authMiddleware, async (req, res) => {
    try {
        const invoices = await Invoice.find({
            user: req.user.userId
        })
            .populate("client")
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// GET SINGLE INVOICE
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user.userId
        }).populate("client");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// UPDATE INVOICE
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.userId
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("client");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// DELETE INVOICE
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            message: "Invoice deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Invoice deleted successfully"
        });
    }
});

module.exports = router;