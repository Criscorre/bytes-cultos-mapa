import jwt from 'jsonwebtoken';
import { runQuery, getQuery } from '@/lib/database';
import ExcelJS from 'exceljs';
import formidable from 'formidable';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

export const config = {
  api: {
    bodyParser: false,
  },
};

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const user = verifyToken(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      // Parse form data
      const form = formidable({ multiples: false });
      const [fields, files] = await form.parse(req);

      if (!files.file || files.file.length === 0) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      const file = files.file[0];
      const fileBuffer = fs.readFileSync(file.filepath);

      // Parse Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res.status(400).json({ message: 'No data found in Excel file.' });
      }

      // Expected columns: Denominación, Congregación, Dirección, Barrio, Municipio, Tipo Sede, Estado Edificio, Tipo Propiedad
      const headers = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value);
      });

      const requiredColumns = ['Denominación', 'Congregación', 'Dirección', 'Barrio', 'Municipio'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        return res.status(400).json({
          message: `Missing required columns: ${missingColumns.join(', ')}`,
          requiredColumns,
          providedColumns: headers
        });
      }

      // Map columns
      const colIndices = {
        denominacion: headers.indexOf('Denominación') + 1,
        congregacion: headers.indexOf('Congregación') + 1,
        direccion: headers.indexOf('Dirección') + 1,
        barrio: headers.indexOf('Barrio') + 1,
        municipio: headers.indexOf('Municipio') + 1,
        tipoSede: headers.indexOf('Tipo Sede') + 1,
        estadoEdificio: headers.indexOf('Estado Edificio') + 1,
        tipoPropiedad: headers.indexOf('Tipo Propiedad') + 1,
      };

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process rows
      for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
        try {
          const row = worksheet.getRow(rowNum);
          const denominacion = row.getCell(colIndices.denominacion).value;
          const congregacion = row.getCell(colIndices.congregacion).value;
          const direccion = row.getCell(colIndices.direccion).value;
          const barrio = row.getCell(colIndices.barrio).value;
          const municipio = row.getCell(colIndices.municipio).value;
          const tipoSede = row.getCell(colIndices.tipoSede).value || 'Sede';
          const estadoEdificio = row.getCell(colIndices.estadoEdificio).value || 'Bueno';
          const tipoPropiedad = row.getCell(colIndices.tipoPropiedad).value || 'Alquilado';

          // Skip empty rows
          if (!denominacion || !congregacion || !direccion || !barrio || !municipio) {
            continue;
          }

          // Get municipality ID
          const muniRecord = await getQuery(
            'SELECT id FROM municipalities WHERE name = ?',
            [municipio]
          );

          if (!muniRecord) {
            errors.push(`Row ${rowNum}: Municipality "${municipio}" not found.`);
            errorCount++;
            continue;
          }

          // Insert institution
          await runQuery(
            `INSERT INTO institutions 
             (user_id, denomination, congregation, address, neighborhood, municipality_id, type, edifice_state, property_type, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user.id, denominacion, congregacion, direccion, barrio, muniRecord.id, tipoSede, estadoEdificio, tipoPropiedad, null, null]
          );

          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Row ${rowNum}: ${err.message}`);
        }
      }

      // Clean up temp file
      fs.unlinkSync(file.filepath);

      res.status(200).json({
        message: `Datos importados exitosamente. ${successCount} registros creados.`,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err) {
      console.error('Excel import error:', err);
      res.status(500).json({ message: 'Error importing Excel file.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
