import { createClient } from '@/lib/supabase/server'
import { UploadForm } from './upload-form'
import { deleteMedia } from './actions'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

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
        <h1 className="text-2xl font-bold text-gray-900">Media</h1>
        <UploadForm />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files?.map((file) => (
          <div key={file.id} className="bg-white rounded-lg border overflow-hidden group">
            {file.file_type === 'image' ? (
              <div className="relative aspect-square bg-gray-100">
                <Image src={file.public_url} alt={file.filename} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-gray-600 truncate">{file.filename}</p>
              <div className="flex gap-1 mt-1">
                <form action={async () => {
                  'use server'
                  await deleteMedia(file.id, file.storage_path)
                }}>
                  <Button variant="ghost" size="sm" type="submit"
                    className="text-xs h-6 px-2 text-red-500">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {!files?.length && (
          <div className="col-span-full py-12 text-center text-gray-400">
            Belum ada media. Upload gambar atau dokumen untuk campaign.
          </div>
        )}
      </div>
    </div>
  )
}
