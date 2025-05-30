interface OfflineData {
  id: string;
  type: "assessment" | "profile" | "preferences";
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = "nutrimood-offline";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains("offlineData")) {
          const store = db.createObjectStore("offlineData", { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }
      };
    });
  }

  async store(
    type: OfflineData["type"],
    data: Record<string, unknown>
  ): Promise<string> {
    if (!this.db) await this.init();

    const id = `${type}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const offlineData: OfflineData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const request = store.add(offlineData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async get(id: string): Promise<OfflineData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readonly");
      const store = transaction.objectStore("offlineData");
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getByType(type: OfflineData["type"]): Promise<OfflineData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readonly");
      const store = transaction.objectStore("offlineData");
      const index = store.index("type");
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  async getUnsynced(): Promise<OfflineData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readonly");
      const store = transaction.objectStore("offlineData");
      const index = store.index("synced");
      const request = index.getAll(IDBKeyRange.only(false));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offlineData"], "readwrite");
      const store = transaction.objectStore("offlineData");
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async sync(): Promise<void> {
    const unsynced = await this.getUnsynced();

    for (const item of unsynced) {
      try {
        await this.syncItem(item);
        await this.markAsSynced(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
      }
    }
  }

  private async syncItem(item: OfflineData): Promise<void> {
    const endpoint = this.getEndpointForType(item.type);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  private getEndpointForType(type: OfflineData["type"]): string {
    switch (type) {
      case "assessment":
        return "/api/assessments";
      case "profile":
        return "/api/profile";
      case "preferences":
        return "/api/preferences";
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Hook for using offline storage
export function useOfflineStorage() {
  const storeData = async (
    type: OfflineData["type"],
    data: Record<string, unknown>
  ) => {
    try {
      if (navigator.onLine) {
        // If online, try to sync immediately
        const endpoint = offlineStorage["getEndpointForType"](type);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          return response.json();
        }
      }

      // If offline or sync failed, store locally
      const id = await offlineStorage.store(type, data);
      return { id, stored: "offline" };
    } catch (error) {
      console.error("Failed to store data:", error);
      throw error;
    }
  };

  const syncData = async () => {
    try {
      await offlineStorage.sync();
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  };

  return {
    storeData,
    syncData,
    offlineStorage,
  };
}
