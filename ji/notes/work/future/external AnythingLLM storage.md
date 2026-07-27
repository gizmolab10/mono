# External AnythingLLM storage

> Put the Docker AnythingLLM's whole store — its database, vectors, and documents — on an external drive instead of the internal disk. macOS + Docker Desktop.

## Why

AnythingLLM (Docker) keeps everything under one folder that's bind-mounted into the container at `/app/server/storage`. Point that mount at a folder on an external drive and the entire store lives on the drive — nothing else changes.

## Steps

Replace `MyDrive` with the drive's name, and `~/anythingllm` with wherever the current mount points (whatever your `-v` uses today).

1. **Stop the container.** `docker stop anythingllm` — then `docker rm anythingllm` if you launch with `docker run` (leave it if you use Compose).
2. **Make the destination on the drive.** `mkdir -p /Volumes/MyDrive/anythingllm`
3. **Move the existing data over — don't lose it.** `cp -a ~/anythingllm/. /Volumes/MyDrive/anythingllm/` — the `-a` keeps permissions and hidden files. Check it copied before deleting the original.
4. **Let Docker reach the drive.** Docker Desktop → Settings → Resources → File Sharing → add `/Volumes/MyDrive` → Apply & Restart. (Docker on the Mac runs in a VM and only bind-mounts paths it's been told it can share.)
5. **Start it, pointed at the drive:**

        export STORAGE_LOCATION="/Volumes/MyDrive/anythingllm"
        docker run -d -p 3001:3001 \
          --name anythingllm \
          -v "${STORAGE_LOCATION}:/app/server/storage" \
          -e STORAGE_DIR="/app/server/storage" \
          mintplexlabs/anythingllm

    Compose equivalent: point the storage volume at `/Volumes/MyDrive/anythingllm:/app/server/storage` and keep `STORAGE_DIR=/app/server/storage`.
6. **Confirm.** Open AnythingLLM — workspace, documents, and chats should all be there. New files land under `/Volumes/MyDrive/anythingllm`.

## Cautions

- **Mount the drive before starting the container.** If the drive isn't mounted, Docker creates an empty folder at that path and AnythingLLM looks wiped — the data is still on the drive, so re-mount and restart to get it back.
- **Use an APFS or Mac OS Extended drive, not exFAT/FAT.** SQLite and file permissions misbehave on exFAT.
- **A slow or sleeping drive slows AnythingLLM.** The database and vectors now live on it, so a spinning-down USB drive adds lag to every read and write.

## Sources

- [How to use Docker — AnythingLLM (GitHub)](https://github.com/Mintplex-Labs/anything-llm/blob/master/docker/HOW_TO_USE_DOCKER.md)
- [Desktop storage layout — AnythingLLM Docs](https://docs.anythingllm.com/installation-desktop/storage)
