-- Add ip_address and device_type to participants table if missing
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Update participants with empty ip/device data when they get inserted
UPDATE public.participants 
SET ip_address = COALESCE(ip_address, ''), 
    device_type = COALESCE(device_type, 'unknown') 
WHERE ip_address IS NULL OR device_type IS NULL;