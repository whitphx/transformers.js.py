try:
    import numpy as np
except ImportError:
    np = None  # type: ignore


def read_audio(filename, sampling_rate: int) -> np.ndarray:
    # Refs:
    # * https://github.com/xenova/transformers.js/blob/2.15.1/src/utils/audio.js#L42-L77
    # * https://huggingface.co/docs/transformers.js/guides/node-audio-processing

    try:
        import scipy  # type: ignore
    except ImportError:
        raise ImportError("The `scipy` library is required to read audio files.")

    original_sample_rate, samples = scipy.io.wavfile.read(filename, mmap=False)

    if samples.dtype == np.int16:
        samples = samples.astype(np.float32) / 32768.0

    if original_sample_rate != sampling_rate:
        samples = scipy.signal.resample(
            samples, int(len(samples) * sampling_rate / original_sample_rate)
        )

    if samples.ndim > 1 and samples.shape[1] > 1:
        SCALING_FACTOR = np.sqrt(2)
        # Merge channels (into first channel to save memory)
        left = samples[:, 0]
        right = samples[:, 1]
        samples = SCALING_FACTOR * (left + right) / 2

    return samples
