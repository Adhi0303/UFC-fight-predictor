# Fighter Image Troubleshooting Guide

## Console Logging Added

Both `RosterPage.jsx` and `SelectionScreen.jsx` now have detailed console logging for image loading.

### What Gets Logged

**On Image Load Success:**
```
[Image Loaded Successfully] Fighter: "Conor McGregor"
  → URL: https://dmxg5wxfqgb4u.cloudfront.net/.../MCGREGOR_CONOR_R.png
```

**On Image Load Failure:**
```
[Image Load Failed] Fighter: "Jon Jones"
  → Attempted URL: https://dmxg5wxfqgb4u.cloudfront.net/.../JONES_JON_R.png
  → Error event: [Event object]
  → Fighter data: {name, weight_classes, image_url}
```

## How to Debug

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Navigate to Roster or Fight Center**
4. **Watch console output** as images load

## Expected Behavior

- ~10-20% of fighters will have working images (UFC.com doesn't have all fighters)
- Failed images show silhouette fallback
- Console shows which URLs work and which don't

## Common Issues

### Issue: "NO URL PROVIDED"
**Cause:** Backend didn't load `fighter_image_mapping.csv`
**Fix:** 
```bash
# Regenerate mapping
python -m src.data.generate_image_urls_fast

# Restart backend
cd web_app/backend
uvicorn main:app --reload
```

### Issue: All images return 404
**Cause:** UFC.com URL pattern changed or CDN is down
**Fix:** Check if UFC.com is accessible, update URL pattern in `generate_image_urls_fast.py`

### Issue: CORS errors
**Cause:** UFC.com blocking cross-origin requests
**Fix:** This is expected for some images. Fallback silhouette will show.

## Testing Image URLs

Run the test script to check which URLs work:
```bash
python -m src.data.test_image_urls
```

Sample output:
```
Testing sample fighter image URLs...

OK Abel Trujillo
OK Abner Lloveras
FAIL Aaron Riley
  URL: https://dmxg5wxfqgb4u.cloudfront.net/.../RILEY_AARON_R.png

Results:
  Working: 2/20 (10.0%)
  Broken: 18/20
```

## URL Pattern

Current pattern:
```
https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{First_Last}/{LAST_FIRST}_R.png
```

Example:
- Fighter: "Conor McGregor"
- Slug: "Conor_McGregor"
- Upper: "MCGREGOR_CONOR"
- URL: `.../Conor_McGregor/MCGREGOR_CONOR_R.png`

## Fallback Behavior

When image fails to load:
1. Console logs error details
2. `imgError` state set to `true`
3. Silhouette icon (`<User />`) displays
4. No broken image icon shown to user

## Production Considerations

For production, consider:
1. **Cache working URLs** - Test all URLs once, save only working ones
2. **Local image storage** - Download working images to avoid external dependency
3. **Alternative sources** - Add Sherdog, Tapology as fallback sources
4. **Lazy loading** - Only load images when visible in viewport
5. **Image optimization** - Compress and resize for web performance
