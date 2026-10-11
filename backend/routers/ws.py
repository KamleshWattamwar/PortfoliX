from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from backend.auth import ALGORITHM, SECRET_KEY
from backend.services.live_feed import feed

router = APIRouter()


def _user_id_from_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


@router.websocket("/ws/portfolio")
async def portfolio_ws(websocket: WebSocket, token: str = Query(...)):
    user_id = _user_id_from_token(token)
    if user_id is None:
        await websocket.close(code=1008)  # auth failed
        return

    await feed.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()  # keeps the socket open, detects disconnect
    except WebSocketDisconnect:
        feed.disconnect(websocket)