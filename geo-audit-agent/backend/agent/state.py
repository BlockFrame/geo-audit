from typing import Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class GeoAuditState(TypedDict):
    url: str
    status: str  # idle | fetching | analyzing | complete | error
    geo_score: Optional[int]
    score_breakdown: Optional[dict]
    crawler_matrix: Optional[list]
    llms_txt_status: Optional[str]
    llms_txt_recommended: Optional[str]
    schema_found: Optional[bool]
    schema_types: Optional[list]
    schema_recommendations: Optional[list]
    meta_issues: Optional[list]
    recommendations: Optional[list]
    report: Optional[dict]
    messages: Annotated[list, add_messages]
