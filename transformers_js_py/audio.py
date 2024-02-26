try:
    import numpy as np
except ImportError:
    np = None  # type: ignore


def read_audio(filename, sampling_rate: int) -> "np.ndarray":
    # Refs:
    # * https://github.com/xenova/transformers.js/blob/2.15.1/src/utils/audio.js#L42-L77
    # * https://huggingface.co/docs/transformers.js/guides/node-audio-processing

    try:
        import numpy as np
        import scipy  # type: ignore
    except ImportError:
        raise ImportError(
            "You need to have `numpy` and `scipy` installed to use this feature."
        )

    original_sample_rate, samples = scipy.io.wavfile.read(filename, mmap=False)

    # Ensure samples are float32
    # Ref: https://docs.scipy.org/doc/scipy/reference/generated/scipy.io.wavfile.read.html  # noqa: E501
    if samples.dtype == np.int16:
        samples = samples.astype(np.float32) / 32768.0
    elif samples.dtype == np.int32:
        samples = samples.astype(np.float32) / 2147483648.0
    elif samples.dtype == np.uint8:
        samples = (samples.astype(np.float32) - 128.0) / 128.0

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
