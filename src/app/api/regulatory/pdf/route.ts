import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const dossierData = await request.json()
    
    if (!dossierData || !dossierData.id) {
      return NextResponse.json(
        { error: 'Données du dossier invalides' },
        { status: 400 }
      )
    }
    
    // Create temporary files
    const tempDir = os.tmpdir()
    const timestamp = Date.now()
    const safeId = String(dossierData.id).replace(/[^a-zA-Z0-9_-]/g, '')
    const jsonFile = path.join(tempDir, `dossier_${safeId}_${timestamp}.json`)
    const outputFile = path.join(tempDir, `dossier_${safeId}_${timestamp}.pdf`)
    
    // Write JSON data to temp file
    await writeFile(jsonFile, JSON.stringify(dossierData))
    
    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_amm_pdf.py')
    
    // Execute Python script with JSON file as input
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" --json-file "${jsonFile}" --output "${outputFile}"`,
      {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 30000 // 30 second timeout
      }
    )
    
    if (stderr && !stderr.includes('PDF generated')) {
      console.error('Python stderr:', stderr)
    }
    
    // Read the generated PDF
    const pdfBuffer = await readFile(outputFile)
    
    // Clean up temp files
    await unlink(jsonFile).catch(() => {})
    await unlink(outputFile).catch(() => {})
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Dossier_AMM_${safeId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF', details: String(error) },
      { status: 500 }
    )
  }
}
