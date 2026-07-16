import { FileUploaded as FileUploadedEvent } from "../generated/FileStorageNFT/FileStorageNFT"
import { FileEntity } from "../generated/schema"

export function handleFileUploaded(event: FileUploadedEvent): void {
  const entity = new FileEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.uploader = event.params.uploader
  entity.cid = event.params.cid
  entity.fileName = event.params.fileName
  entity.save()
}
