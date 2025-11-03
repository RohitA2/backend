// const { BankIdClient } = require('bankid');
// const fs = require('fs');
// const path = require('path');

// // console.log('🔍 Checking BankID configuration...');

// const requiredEnv = ['BANKID_PFX_PATH', 'BANKID_PASSPHRASE'];
// requiredEnv.forEach((v) => {
//   if (!process.env[v]) console.error(`❌ Missing environment variable: ${v}`);
//   else console.log(`✅ ${v}: ${process.env[v]}`);
// });

// const pfxPath = path.resolve(process.env.BANKID_PFX_PATH);
// if (!fs.existsSync(pfxPath)) console.error(`❌ Certificate file not found: ${pfxPath}`);
// // else console.log(`✅ Found certificate file: ${pfxPath}`);

// let caPath;
// if (process.env.BANKID_CA_PATH) {
//   caPath = path.resolve(process.env.BANKID_CA_PATH);
//   if (fs.existsSync(caPath)) console.log(`✅ Found CA file: ${caPath}`);
//   else console.warn(`⚠️ CA file not found: ${caPath}`);
// }

// // ✅ Initialize BankID client
// let client;
// try {
//   client = new BankIdClient({
//     url: 'https://appapi2.test.bankid.com/rp/v6',
//     pfx: fs.readFileSync(pfxPath),
//     passphrase: process.env.BANKID_PASSPHRASE,
//     ca: caPath ? [fs.readFileSync(caPath)] : undefined,
//   });
//   // console.log('✅ BankID client initialized successfully');
// } catch (err) {
//   console.error('❌ Failed to initialize BankID client:', err);
// }

// // ✅ Force IPv4 function
// function getIPv4(req) {
//   let ip =
//     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
//     req.socket?.remoteAddress ||
//     '127.0.0.1';

//   if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
//   if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
//   return ip;
// }

// // ✅ Initiate sign
// const initiateSign = async (req, res) => {
//   try {
//     const { userVisibleData, personalNumber } = req.body;
//     if (!userVisibleData) return res.status(400).json({ error: 'userVisibleData required' });

//     const endUserIp = getIPv4(req);
//     const encodedData = Buffer.from(userVisibleData, 'utf8').toString('base64');

//     console.log('📩 BankID sign initiation request:', {
//       userVisibleData,
//       personalNumber,
//       endUserIp,
//     });

//     const result = await client.sign({
//       endUserIp,
//       personalNumber: personalNumber || '191212121212',
//       userVisibleData: encodedData,
//     });

//     console.log('✅ BankID sign initiated successfully:', result);
//     res.json({ success: true, data: result });
//   } catch (error) {
//     console.error('❌ Sign initiation error:', {
//       message: error.message,
//       code: error.code,
//       details: error.details,
//     });

//     res.status(500).json({
//       success: false,
//       message: 'BankID sign initiation failed',
//       error: {
//         code: error.code || 'UNKNOWN_ERROR',
//         details: error.details || error.message || 'No details from BankID',
//       },
//     });
//   }
// };

// // ✅ Collect status
// const collectStatus = async (req, res) => {
//   try {
//     const { orderRef } = req.params;
//     if (!orderRef) return res.status(400).json({ error: 'orderRef required' });

//     console.log('📩 Collecting status for orderRef:', orderRef);
//     const result = await client.collect({ orderRef });
//     console.log('✅ Collect result:', result);
//     res.json({ success: true, data: result });
//   } catch (error) {
//     console.error('❌ Collect error:', {
//       message: error.message,
//       code: error.code,
//       details: error.details,
//     });

//     res.status(500).json({
//       success: false,
//       message: 'BankID collect failed',
//       error: {
//         code: error.code || 'UNKNOWN_ERROR',
//         details: error.details || error.message,
//       },
//     });
//   }
// };

// module.exports = { initiateSign, collectStatus };
