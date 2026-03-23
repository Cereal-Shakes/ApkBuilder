from utils.util import get_logger
import xml.etree.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"

def parse_layout(path):
    try:
        tree = ET.parse(path)
        return tree.getroot()
    except ET.ParseError as e:
        get_logger().error(f"> XML parse error: {e}")
        raise