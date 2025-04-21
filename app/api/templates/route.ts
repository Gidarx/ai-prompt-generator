import { NextResponse } from 'next/server';
import { templates } from '@/lib/promptTemplates';

// Rota simples para retornar a lista de templates predefinidos
export async function GET() {
  try {
    // Retorna a lista de templates como JSON
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("Erro ao buscar templates:", error.message);
    return NextResponse.json(
      { error: `Erro interno ao buscar templates: ${error.message}` },
      { status: 500 }
    );
  }
} 