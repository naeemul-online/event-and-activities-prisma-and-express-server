import catchAsync from "../../shared/catchAsync";
import { HostService } from "./host.service";

const getTopRatedHosts = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 5;

  const data = await HostService.getTopRatedHosts(limit);

  res.status(200).json({
    success: true,
    data,
  });
});

export const HostController = {
  getTopRatedHosts,
};
