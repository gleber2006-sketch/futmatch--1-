
-- Criar bucket 'team-logos' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de Leitura Pública
CREATE POLICY "Logos de time são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'team-logos' );

-- Política de Upload Autenticado
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos'
  AND auth.role() = 'authenticated'
);

-- Política de Atualização (Apenas o próprio usuário ou lógica específica, mas storage RLS é simples)
-- Vamos permitir update se for autenticado por simplicidade, ou restringir pelo nome do arquivo se contiver o ID
CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'team-logos' AND auth.role() = 'authenticated' );

-- Política de Delete (Opcional, mas bom ter)
CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'team-logos' AND auth.role() = 'authenticated' );
