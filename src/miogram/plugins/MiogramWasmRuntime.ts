/**
 * MiogramWasmRuntime: WebAssembly plugin host runtime.
 * Implements 1:1 the ABI and MIOG wire envelope from mioplugin/sdk/rust.
 *
 * Wire Envelope Layout (little-endian):
 * 0..4   magic b"MIOG"
 * 4      version = 1
 * 5..8   reserved (zeros)
 * 8..12  op_len: u32
 * 12..12+op_len  op: UTF-8
 * 12+op_len..    payload bytes
 *
 * Exported functions expected from guest WASM:
 * - miogram_abi_version() -> i32 (must return 1)
 * - miogram_alloc(len: i32) -> i32
 * - miogram_guest_free(ptr: i32, len: i32) -> void
 * - miogram_call(ptr: i32, len: i32) -> i64 (packed resp_ptr << 32 | len)
 */

export const MAGIC = new Uint8Array([0x4d, 0x49, 0x4f, 0x47]); // "MIOG"
export const VERSION = 1;
const HEADER_LEN = 12;

export interface WasmPluginInstance {
  id: string;
  name: string;
  instance: WebAssembly.Instance;
  memory: WebAssembly.Memory;
  call: (op: string, payload: Uint8Array) => Uint8Array;
}

export class MiogramWasmRuntime {
  public static encodeEnvelope(op: string, payload: Uint8Array): Uint8Array {
    const encoder = new TextEncoder();
    const opBytes = encoder.encode(op);
    const totalLen = HEADER_LEN + opBytes.length + payload.length;

    const out = new Uint8Array(totalLen);
    out.set(MAGIC, 0);
    out[4] = VERSION;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;

    const view = new DataView(out.buffer);
    view.setUint32(8, opBytes.length, true); // Little endian

    out.set(opBytes, HEADER_LEN);
    out.set(payload, HEADER_LEN + opBytes.length);

    return out;
  }

  public static decodeEnvelope(buf: Uint8Array): { op: string; payload: Uint8Array } {
    if (buf.length < HEADER_LEN) throw new Error('Envelope too short');
    for (let i = 0; i < 4; i++) {
      if (buf[i] !== MAGIC[i]) throw new Error('Bad MIOG magic');
    }
    if (buf[4] !== VERSION) throw new Error(`Unsupported version ${buf[4]}`);

    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const opLen = view.getUint32(8, true);
    const opEnd = HEADER_LEN + opLen;
    if (buf.length < opEnd) throw new Error('Truncated envelope');

    const decoder = new TextDecoder();
    const op = decoder.decode(buf.subarray(HEADER_LEN, opEnd));
    const payload = buf.subarray(opEnd);

    return { op, payload };
  }

  public static async loadPlugin(
    id: string,
    name: string,
    wasmBytes: ArrayBuffer | Uint8Array
  ): Promise<WasmPluginInstance> {
    const memory = new WebAssembly.Memory({ initial: 16 });

    const importObject = {
      env: {
        memory,
        abort: () => console.error(`[Wasm:${id}] Aborted`),
      },
    };

    const module = await WebAssembly.instantiate(wasmBytes, importObject);
    const instance = module.instance;
    const exports = instance.exports as any;

    const wasmMemory: WebAssembly.Memory = exports.memory || memory;

    // Check ABI version
    if (typeof exports.miogram_abi_version === 'function') {
      const abiVer = exports.miogram_abi_version();
      if (abiVer !== 1) {
        throw new Error(`Unsupported WASM ABI version: ${abiVer}`);
      }
    }

    if (typeof exports.miogram_create_plugin === 'function') {
      exports.miogram_create_plugin();
    }

    const callFn = (op: string, payload: Uint8Array): Uint8Array => {
      if (typeof exports.miogram_alloc !== 'function' || typeof exports.miogram_call !== 'function') {
        throw new Error(`Plugin ${id} does not export required miogram_alloc / miogram_call`);
      }

      const reqFrame = this.encodeEnvelope(op, payload);
      const reqPtr = exports.miogram_alloc(reqFrame.length);
      if (reqPtr === 0) throw new Error('Out of memory in WASM guest');

      const memView = new Uint8Array(wasmMemory.buffer);
      memView.set(reqFrame, reqPtr);

      const packedRes = BigInt(exports.miogram_call(reqPtr, reqFrame.length));

      // Free request buffer
      if (typeof exports.miogram_guest_free === 'function') {
        exports.miogram_guest_free(reqPtr, reqFrame.length);
      }

      if (packedRes < 0n) {
        throw new Error(`WASM call failed with code: ${packedRes}`);
      }

      const respPtr = Number(packedRes >> 32n);
      const respLen = Number(packedRes & 0xffffffffn);

      if (respLen === 0) return new Uint8Array(0);

      const freshMemView = new Uint8Array(wasmMemory.buffer);
      const respBytes = freshMemView.slice(respPtr, respPtr + respLen);

      // Free response buffer
      if (typeof exports.miogram_guest_free === 'function') {
        exports.miogram_guest_free(respPtr, respLen);
      }

      const decoded = this.decodeEnvelope(respBytes);
      return decoded.payload;
    };

    return {
      id,
      name,
      instance,
      memory: wasmMemory,
      call: callFn,
    };
  }
}

export default MiogramWasmRuntime;
