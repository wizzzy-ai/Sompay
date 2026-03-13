import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  addAddress,
  updateAddress,
  getAddress,
  deleteAddress
} from '../controllers/addressController.js';


const router = express.Router();

router.get('/', authenticateToken, getAddress);

/**
 * @swagger
 * /api/address:
 *   post:
 *     summary: Add user address
 *     description: Creates a new address for the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - houseAddress
 *               - street
 *               - state
 *               - country
 *             properties:
 *               houseAddress:
 *                 type: string
 *                 description: House address
 *               street:
 *                 type: string
 *                 description: Street name
 *               state:
 *                 type: string
 *                 description: State
 *               country:
 *                 type: string
 *                 description: Country
 *     responses:
 *       200:
 *         description: Address added successfully
 *       400:
 *         description: User already has an address
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, addAddress);

/**
 * @swagger
 * /api/address:
 *   get:
 *     summary: Get user address
 *     description: Retrieves the address of the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: object
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, getAddress);

/**
 * @swagger
 * /api/address:
 *   put:
 *     summary: Update user address
 *     description: Updates the address of the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - houseAddress
 *               - street
 *               - state
 *               - country
 *             properties:
 *               houseAddress:
 *                 type: string
 *                 description: House address
 *               street:
 *                 type: string
 *                 description: Street name
 *               state:
 *                 type: string
 *                 description: State
 *               country:
 *                 type: string
 *                 description: Country
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.put('/', authenticateToken, updateAddress);

/**
 * @swagger
 * /api/address:
 *   delete:
 *     summary: Delete user address
 *     description: Deletes the address of the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete('/', authenticateToken, deleteAddress);

export default router;
