import { createClient } from '@/lib/supabase/server'
import { UploadForm } from './upload-form'
import { deleteMedia } from './actions'
import { Button } from '@/components/ui/button'
export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: files } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Media</h1>
        <UploadForm />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files?.map((file) => (
          <div key={file.id} className="bg-card rounded-lg border border-border overflow-hidden group">
            {file.file_type === 'image' ? (
              <div className="relative aspect-square bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.public_url} alt={file.filename} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-square bg-secondary flex items-center justify-center">
                <span className="text-3xl text-muted-foreground">doc</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">{file.filename}</p>
              <div className="flex gap-1 mt-1">
                <form action={async () => {
                  'use server'
                  await deleteMedia(file.id, file.storage_path)
                }}>
                  <Button variant="ghost" size="sm" type="submit"
                    className="text-xs h-6 px-2 text-destructive">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {!files?.length && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Belum ada media. Upload gambar atau dokumen untuk campaign.
          </div>
        )}
      </div>
    </div>
  )
}
